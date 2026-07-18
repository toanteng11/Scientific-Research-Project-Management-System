package com.researchsystem.backend.service.impl;

import com.researchsystem.backend.domain.entity.Department;
import com.researchsystem.backend.domain.entity.User;
import com.researchsystem.backend.domain.enums.SystemRole;
import com.researchsystem.backend.dto.request.CreateCouncilMemberAccountRequest;
import com.researchsystem.backend.dto.request.CreateDeptHeadRequest;
import com.researchsystem.backend.dto.request.CreateManagerRequest;
import com.researchsystem.backend.dto.request.CreateResearcherRequest;
import com.researchsystem.backend.dto.request.UpdateUserStatusRequest;
import com.researchsystem.backend.dto.response.UserResponse;
import com.researchsystem.backend.repository.DepartmentRepository;
import com.researchsystem.backend.repository.UserRepository;
import com.researchsystem.backend.util.SecureTokenGenerator;
import lombok.extern.slf4j.Slf4j;
import com.researchsystem.backend.service.EmailService;
import com.researchsystem.backend.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Override
    @Transactional
    public UserResponse createCouncilExpert(CreateCouncilMemberAccountRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use: " + request.getEmail());
        }

        // Sinh mật khẩu ngẫu nhiên 10 ký tự (chữ hoa, thường, số)
        String temporaryPassword = SecureTokenGenerator.opaqueUrlSafe(10);

        User expert = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(temporaryPassword))
                .fullName(request.getFullName())
                .academicTitle(request.getAcademicTitle())
                .systemRole(SystemRole.COUNCIL)
                .isFirstLogin(true) // Bắt buộc đổi mật khẩu lần đầu
                .active(true)
                .department(null) // Chuyên gia hội đồng không nhất thiết thuộc khoa nào trong trường
                .build();

        User saved = userRepository.save(expert);

        emailService.sendPlainText(
                saved.getEmail(),
                "Tài khoản Hệ thống Quản lý Đề tài NCKH — Thông tin đăng nhập",
                String.format(
                        """
                        Kính gửi %s,

                        Tài khoản trên Hệ thống Quản lý Đề tài NCKH đã được tạo cho Ngài.

                        --- THÔNG TIN ĐĂNG NHẬP ---
                        Tài khoản: %s
                        Mật khẩu tạm thời: %s

                        Lưu ý: Hệ thống yêu cầu Ngài đổi mật khẩu trong lần đăng nhập đầu tiên.
                        Đường dẫn đăng nhập: https://qldt.ou.edu.vn/login

                        Trân trọng,
                        Hệ thống Quản lý Đề tài NCKH — Trường Đại học Mở TP.HCM
                        """,
                        saved.getFullName(),
                        saved.getEmail(),
                        temporaryPassword
                ));

        return toUserResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse createManager(CreateManagerRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use: " + request.getEmail());
        }
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found"));

        User manager = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getInitialPassword()))
                .fullName(request.getFullName())
                .academicTitle(request.getAcademicTitle())
                .systemRole(SystemRole.MANAGER)
                .isFirstLogin(true)
                .active(true)
                .department(department)
                .build();

        return toUserResponse(userRepository.save(manager));
    }

    @Override
    @Transactional
    public UserResponse createResearcher(CreateResearcherRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use: " + request.getEmail());
        }
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found"));

        User researcher = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getInitialPassword()))
                .fullName(request.getFullName())
                .academicTitle(request.getAcademicTitle())
                .systemRole(SystemRole.RESEARCHER)
                .isFirstLogin(true)
                .active(true)
                .department(department)
                .build();

        return toUserResponse(userRepository.save(researcher));
    }

    @Override
    @Transactional
    public UserResponse createDeptHead(CreateDeptHeadRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use: " + request.getEmail());
        }
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found"));

        User head = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getInitialPassword()))
                .fullName(request.getFullName())
                .academicTitle(request.getAcademicTitle())
                .systemRole(SystemRole.DEPT_HEAD)
                .isFirstLogin(true)
                .active(true)
                .department(department)
                .build();

        return toUserResponse(userRepository.save(head));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toUserResponse);
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request, String actorEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (user.getEmail().equals(actorEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Self-termination denied.");
        }
        user.setActive(request.getActive());
        return toUserResponse(userRepository.save(user));
    }

    // BỔ SUNG: Hiện thực hóa việc lấy danh sách giảng viên tham gia
    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getEligibleTopicMembers() {
        List<SystemRole> eligibleRoles = List.of(SystemRole.RESEARCHER, SystemRole.DEPT_HEAD);
        return userRepository.findBySystemRoleInAndActiveTrue(eligibleRoles).stream()
                .map(this::toUserResponse)
                .toList();
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .academicTitle(user.getAcademicTitle())
                .systemRole(user.getSystemRole())
                .firstLogin(user.isFirstLogin())
                .active(user.isActive())
                .departmentName(user.getDepartment() != null ? user.getDepartment().getDepartmentName() : null)
                .build();
    }
}