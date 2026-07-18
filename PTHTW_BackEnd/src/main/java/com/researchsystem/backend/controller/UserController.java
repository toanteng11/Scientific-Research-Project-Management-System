package com.researchsystem.backend.controller;

import com.researchsystem.backend.dto.request.CreateCouncilMemberAccountRequest;
import com.researchsystem.backend.dto.request.CreateDeptHeadRequest;
import com.researchsystem.backend.dto.request.CreateManagerRequest;
import com.researchsystem.backend.dto.request.CreateResearcherRequest;
import com.researchsystem.backend.dto.request.UpdateUserStatusRequest;
import com.researchsystem.backend.dto.response.UserResponse;
import com.researchsystem.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "User Management", description = "Account creation and user status administration")
public class UserController {

    private static final Set<String> ALLOWED_SORT_FIELDS =
            Set.of("userId", "email", "fullName", "systemRole", "active");

    private final UserService userService;

    // =========================================================================================
    // ĐIỂM CUỐI MỚI: TẠO TÀI KHOẢN CHUYÊN GIA HỘI ĐỒNG (QUY TRÌNH 2)
    // =========================================================================================
    @PostMapping("/experts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(
            summary = "Tạo tài khoản Chuyên gia Hội đồng (COUNCIL)",
            description = "Quản trị viên hoặc Phòng QLKH tạo tài khoản cho chuyên gia ngoài/trong trường. Mật khẩu được tự động sinh và gửi qua email."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tài khoản chuyên gia đã được tạo thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi xác thực dữ liệu hoặc Email đã tồn tại"),
            @ApiResponse(responseCode = "403", description = "Forbidden — Yêu cầu quyền ADMIN hoặc MANAGER")
    })
    public ResponseEntity<UserResponse> createCouncilExpert(@Valid @RequestBody CreateCouncilMemberAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createCouncilExpert(request));
    }

    @PostMapping("/managers")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create a new MANAGER account",
            description = "Admin-only endpoint that provisions a manager user with an initial password " +
                          "and assigns them to a department."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Manager account created successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — validation error or email already in use"),
            @ApiResponse(responseCode = "403", description = "Forbidden — ADMIN role required")
    })
    public ResponseEntity<UserResponse> createManager(@Valid @RequestBody CreateManagerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createManager(request));
    }

    @PostMapping("/researchers")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create a new RESEARCHER account",
            description = "Admin-only endpoint that provisions a principal investigator with initial password " +
                          "and assigns them to a department."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Researcher account created"),
            @ApiResponse(responseCode = "400", description = "Bad Request — validation or duplicate email"),
            @ApiResponse(responseCode = "403", description = "Forbidden — ADMIN role required")
    })
    public ResponseEntity<UserResponse> createResearcher(@Valid @RequestBody CreateResearcherRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createResearcher(request));
    }

    @PostMapping("/dept-heads")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create a new DEPT_HEAD account",
            description = "Admin-only endpoint that provisions a department head with initial password " +
                          "and assigns them to a department."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Department head account created"),
            @ApiResponse(responseCode = "400", description = "Bad Request — validation or duplicate email"),
            @ApiResponse(responseCode = "403", description = "Forbidden — ADMIN role required")
    })
    public ResponseEntity<UserResponse> createDeptHead(@Valid @RequestBody CreateDeptHeadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createDeptHead(request));
    }

    @GetMapping("/")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RESEARCHER', 'DEPT_HEAD')") // Đã mở rộng quyền truy cập
    @Operation(
            summary = "List all users (paginated)",
            description = "Returns a paginated list of all system users. Accessible by authenticated users for search functions."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User list returned successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — invalid pagination parameters"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @ParameterObject @PageableDefault(size = 20, sort = "userId") Pageable pageable) {
        pageable.getSort().forEach(order -> {
            if (!ALLOWED_SORT_FIELDS.contains(order.getProperty())) {
                throw new IllegalArgumentException("Invalid sort field: " + order.getProperty());
            }
        });
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }

    @GetMapping("/eligible-members")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'DEPT_HEAD')")
    @Operation(
            summary = "Lấy danh sách giảng viên đủ điều kiện tham gia đề tài",
            description = "Trả về danh sách các người dùng có vai trò RESEARCHER hoặc DEPT_HEAD đang hoạt động."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Danh sách trả về thành công"),
            @ApiResponse(responseCode = "403", description = "Forbidden — Yêu cầu quyền RESEARCHER hoặc DEPT_HEAD")
    })
    public ResponseEntity<List<UserResponse>> getEligibleTopicMembers() {
        return ResponseEntity.ok(userService.getEligibleTopicMembers());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Lock or unlock a user account",
            description = "Admin-only endpoint. Sets the user's active flag to lock (false) or unlock (true) " +
                          "their ability to authenticate."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User status updated successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — validation error"),
            @ApiResponse(responseCode = "403", description = "Forbidden — ADMIN role required")
    })
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            java.security.Principal principal) {
        return ResponseEntity.ok(userService.updateUserStatus(id, request, principal.getName()));
    }   
}